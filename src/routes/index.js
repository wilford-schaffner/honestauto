import { Router } from 'express';

import publicRoutes from './public.js';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import employeeRoutes from './employee.js';
import ownerRoutes from './owner.js';

const router = Router();

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/dashboard/employee', employeeRoutes);
router.use('/dashboard/owner', ownerRoutes);

export default router;