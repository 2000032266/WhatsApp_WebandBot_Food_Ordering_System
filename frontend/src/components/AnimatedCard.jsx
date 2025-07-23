import React from 'react';
import { Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';

const AnimatedCard = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    style={{ height: '100%' }}
  >
    <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }} {...props}>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);

export default AnimatedCard;
