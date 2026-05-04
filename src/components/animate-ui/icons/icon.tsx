import * as React from 'react';
import { useAnimation } from 'motion/react';

interface AnimateIconContextValue {
  controls: any;
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
  animate,
  ...props
}: any) {
  const controls = useAnimation();

  React.useEffect(() => {
    if (animate === true || animate === 'animate') {
      controls.start('animate');
    } else if (animate === false || animate === 'initial' || animate === 'normal') {
      controls.start('initial');
    }
  }, [animate, controls]);

  const handleMouseEnter = (e: any) => {
    controls.start('animate');
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: any) => {
    controls.start('initial');
    onMouseLeave?.(e);
  };

  const handleClick = (e: any) => {
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
        style={{ 
          display: 'inline-flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer', 
          zIndex: 10,
          ...containerStyle 
        }}
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
