import * as React from 'react';
import { useAnimation, AnimationControls } from 'motion/react';

interface AnimateIconContextValue {
  controls: AnimationControls | 'initial' | 'animate';
}

const AnimateIconContext = React.createContext<AnimateIconContextValue>({
  controls: 'initial',
});

export function useAnimateIconContext() {
  return React.useContext(AnimateIconContext);
}

export function getVariants(animations: any) {
  return animations.default || animations;
}

export type IconProps<T> = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

export function IconWrapper({
  icon: IconComponent,
  onMouseEnter,
  onMouseLeave,
  onClick,
  label,
  containerStyle,
  ...props
}: any) {
  const controls = useAnimation();

  const handleMouseEnter = (e: any) => {
    controls.start('animate');
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: any) => {
    controls.start('initial');
    onMouseLeave?.(e);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    controls.start('animate');
    setTimeout(() => {
      controls.start('initial');
    }, 600);
    onClick?.(e);
  };

  return (
    <AnimateIconContext.Provider value={{ controls }}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, padding: 12, gap: 4, transition: 'background-color 0.3s ease', ...containerStyle }}
      >
        <IconComponent {...props} style={{ transition: 'color 0.3s ease', ...(props.style || {}) }} />
        {label && (
          <span style={{ 
            color: props.color, 
            transition: 'color 0.3s ease', 
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500
          }}>
            {label}
          </span>
        )}
      </div>
    </AnimateIconContext.Provider>
  );
}
