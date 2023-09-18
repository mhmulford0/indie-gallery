import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import { FastifySSEPlugin } from 'fastify-sse-v2';
import { generateNonce, SiweMessage } from 'siwe';
import { Network, Alchemy } from 'alchemy-sdk';

type Message = {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
};

if (!process.env.COOKIE_SECRET || !process.env.ALCHEMY_ID) {
    throw new Error('envs must be set must be set');
}

const settings = {
    apiKey: process.env.ALCHEMY_ID, // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
};

const alchemy = new Alchemy(settings);

const f = Fastify({ logger: true });

// Plugin Setup

await f.register(cors, {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    preflightContinue: true,
    hideOptionsRoute: true,
    maxAge: 600,
});
await f.register(secureSession, {
    secret: process.env.COOKIE_SECRET,
    salt: 'mq9hDxBVDbspDR6n',
    cookie: {
        path: '/',
        httpOnly: true,
        expires: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
});
f.register(FastifySSEPlugin);

// Routes & Handlers

f.get('/', (request, reply) => {
    reply.send({ hello: 'world' });
});

f.get('/nonce', (req, res) => {
    res.send(generateNonce());
});

f.get('/session', (req, res) => {
    console.log(req.session.data());
    res.send(generateNonce());
});

f.get('/nfts', async (req, res) => {
    const address = req.session.get('address') as string;

    if (!address || address.length !== 42) {
        res.status(400).send({ error: 'incorrect wallet address' });
    }

    console.log(address);

    const nfts = await alchemy.nft.getNftsForOwner(address);
    console.log(nfts.ownedNfts);

    res.sse(
        (async function* source() {
            for (const nft of nfts.ownedNfts) {
                yield { id: String(nft.tokenId + nft.title), data: JSON.stringify(nft) };
            }
        })(),
    );
});

f.post<{ Body: { message?: Message; signature?: string } }>('/verify', async (req, res) => {
    if (!req.body.message || !req.body.signature) {
        return res.status(400).send();
    }

    const { message, signature } = req.body;

    console.log({ message }, { signature });
    const siweMessage = new SiweMessage(message);
    try {
        await siweMessage.verify({ signature });
        req.session.set('address', message.address);

        res.send(true);
    } catch {
        res.send(false);
    }
});

// Start Server

f.listen({ port: 3001, host: '0.0.0.0' }, function (err) {
    if (err) {
        f.log.error(err);
        process.exit(1);
    }
});
