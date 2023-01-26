import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getReasonPhrase, StatusCodes } from "http-status-codes";

export default async (fastify: FastifyInstance) => {

  fastify.get('/health-check', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await fastify.axios.cockpit.get('/health-check')
      reply
        .status(StatusCodes.OK)
        .send(getReasonPhrase(StatusCodes.OK))
    } catch (error) {
      reply
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR))
    }
  })

} 
