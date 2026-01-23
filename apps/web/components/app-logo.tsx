import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 150,
  src = '/images/execgpt-logo.png',
  alt = 'EXECgpt',
}: {
  className?: string;
  width?: number;
  src?: string;
  alt?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={40}
      className={cn(`w-[120px] lg:w-[150px] h-auto`, className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
  logoSrc,
}: {
  href?: string | null;
  className?: string;
  label?: string;
  logoSrc?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} src={logoSrc} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} src={logoSrc} alt={label ?? 'EXECgpt'} />
    </Link>
  );
}
