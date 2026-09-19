import Image from 'next/image';

interface LogoProps {
  horizontal?: boolean;
  size?: number;
  noMargin?: boolean;
}

export default function Logo({ horizontal = false, size = 45, noMargin = false }: LogoProps) {
  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-2.5' : 'flex-col items-center'} ${noMargin ? '' : 'mb-6'}`}>
      <Image
        src="/icon.png"
        alt="Logo JP KIDS"
        width={size}
        height={size}
        priority
        className="object-contain"
      />
      <h1 className={`font-extrabold tracking-wide bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent ${horizontal ? 'text-lg md:text-xl' : 'text-4xl mt-2'}`}>
        JP KIDS
      </h1>
    </div>
  );
}