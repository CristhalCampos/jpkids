import Link from 'next/link';
import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

interface BaseProps {
  icon?: ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

// Componente para botones nativos
interface ButtonAsButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}

// Componente para enlaces
interface ButtonAsLinkProps extends BaseProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export default function Button({
  icon,
  title,
  variant = 'primary',
  className = '',
  href,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  };

  const isOnlyIcon = icon && !title;
  const hasJustify = className.includes('justify-');
  const defaultJustify = hasJustify ? '' : 'justify-center';
  const combinedClasses = `inline-flex items-center ${defaultJustify} font-medium transition-all rounded-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
    isOnlyIcon ? 'p-2.5 aspect-square' : 'px-4 py-2.5 gap-2.5'
  } ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {icon && <span className="text-lg leading-none shrink-0">{icon}</span>}
        {title && <span className="whitespace-nowrap">{title}</span>}
      </Link>
    );
  }

  return (
    <button {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} className={combinedClasses}>
      {icon && <span className="text-lg leading-none shrink-0">{icon}</span>}
      {title && <span className="whitespace-nowrap">{title}</span>}
    </button>
  );
}