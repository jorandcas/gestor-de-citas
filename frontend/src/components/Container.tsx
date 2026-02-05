import React from 'react';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type ContainerProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const Container: React.FC<ContainerProps> = ({ children, className = '', style }) => (
  <div className={twMerge('min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 via-white to-slate-100', className)} style={style}>
    {children}
  </div>
);

export default Container;