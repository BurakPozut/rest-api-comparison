const fastify = require('fastify')({ logger: false });

fastify.get('/api/data', async (request, reply) => {
  return {
    message: 'Node.js + Fastify response',
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Fastify listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
