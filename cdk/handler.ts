import logger from './src/helpers/logger';

export const helloHandler = () => {
  try {
    logger.info('Hello from Lambda!');
    return 'Hello from Lambda!';
  } catch (error) {
    logger.error('HelloHandler Error.', { error });
    return error;
  }
};
