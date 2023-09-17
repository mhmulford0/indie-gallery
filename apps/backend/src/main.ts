import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import { generateNonce, SiweMessage } from 'siwe';

if (!process.env.COOKIE_SECRET) {
    throw new Error('Cookie secret must be set');
}

const f = Fastify({ logger: true });

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
// Declare a route
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

f.post<{ Body: { message?: string; signature?: string } }>('/verify', async (req, res) => {
    if (!req.body.message || !req.body.signature) {
        return res.status(400).send();
    }

    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    try {
        await siweMessage.verify({ signature });
        req.session.set('address', 'yeet');

        res.send(true);
    } catch {
        res.send(false);
    }
});

f.listen({ port: 3001, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        f.log.error(err);
        process.exit(1);
    }
    // Server is now listening on ${address}
});
