import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

// Page-level transition wrapper
export function PageTransition({ children, id }: { children: ReactNode; id: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Card with hover lift + stagger entry
export function MotionCard({ children, index = 0, className = '', style = {}, onClick, borderLeft }: {
  children: ReactNode; index?: number; className?: string;
  style?: React.CSSProperties; onClick?: () => void; borderLeft?: string;
}) {
  return (
    <motion.div
      className={`nb-card ${className}`}
      style={{ ...style, borderLeft: borderLeft ? `4px solid ${borderLeft}` : undefined, cursor: onClick ? 'pointer' : 'default' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(124,58,237,.12)', borderColor: 'rgba(124,58,237,.3)' }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Stat card with count-up animation feel
export function MotionStat({ children, index = 0, style = {}, onClick }: {
  children: ReactNode; index?: number; style?: React.CSSProperties; onClick?: () => void;
}) {
  return (
    <motion.div
      className="nb-stat"
      style={{ ...style, cursor: onClick ? 'pointer' : 'default' }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -3, boxShadow: '0 6px 20px rgba(124,58,237,.18)' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for grid items
export function StaggerGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Overlay backdrop
export function ModalBackdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[600] flex items-start justify-center pt-16 px-5"
      style={{ background: 'rgba(0,0,0,.65)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Toast animation
export function MotionToast({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={style}
    >
      {children}
    </motion.div>
  );
}
