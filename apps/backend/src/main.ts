import Fastify from 'fastify';
import cors from '@fastify/cors';
import { generateNonce, SiweMessage } from 'siwe';

const f = Fastify();

await f.register(cors, {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    preflightContinue: true,
    hideOptionsRoute: true,
    maxAge: 600,
});

// Declare a route
f.get('/', (request, reply) => {
    reply.send({ hello: 'world' });
});

f.get('/nonce', (req, res) => {
    res.send(generateNonce());
});

f.post<{ Body: { message?: string; signature?: string } }>('/verify', async (req, res) => {
    if (!req.body.message || !req.body.signature) {
        return res.status(400).send();
    }

    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    try {
        const sig = await siweMessage.verify({ signature });
        console.log({ sig });
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
