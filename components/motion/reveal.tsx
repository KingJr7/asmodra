"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Reveal({ children, className, delay = 0, y = 18, ...rest }: RevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <motion.div className={className} {...rest}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      {...rest}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.55, ease: [0.21, 1, 0.31, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

type HoverCardProps = {
  children: ReactNode;
  className?: string;
};

export function HoverCard({ children, className }: HoverCardProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 1100 }}
      whileHover={{
        y: -5,
        rotateX: 2.8,
        rotateY: -2.8,
        scale: 1.012,
      }}
      transition={{ type: "spring", stiffness: 250, damping: 22, mass: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
