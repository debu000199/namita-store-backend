import { Router } from 'express';
import { signin, signout, signup } from '../controllers/auth.controller.js';

const authRouter = Router();

//Signup
authRouter.post('/signup', signup);

//Signin
authRouter.post('/login', signin);

//Signout
authRouter.post('/logout', signout);

export default authRouter;
