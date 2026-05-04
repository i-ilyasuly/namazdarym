'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from './icon';

type BookmarkProps = IconProps<any>;

const animations: any = {
  default: {
    bookmark: {
      initial: { scaleY: 1, scaleX: 1 },
      animate: {
        scaleY: [1, 1.3, 0.9, 1.05, 1],
        scaleX: [1, 0.9, 1.1, 0.95, 1],
        transition: {
          duration: 0.6,
          ease: 'easeOut',
        },
      },
    },
  },
};

function IconComponent({ size, ...props }: BookmarkProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(props as any)}
    >
      <motion.path
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        variants={variants.bookmark}
        initial="initial"
        animate={controls}
        style={{ originY: 0.5, originX: 0.5 }}
      />
    </motion.svg>
  );
}

function BookmarkIcon(props: BookmarkProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  BookmarkIcon,
  BookmarkIcon as Bookmark,
  type BookmarkProps,
};
