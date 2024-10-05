import { Router } from 'express';
import { helloWorldHandler } from './handler';

const router = Router();

router.get('/', helloWorldHandler);

export default router;
