import { Request, Response } from 'express';

export const helloWorldHandler = (req: Request, res: Response) => {
    res.send('Hello from EC2 App!');
};
