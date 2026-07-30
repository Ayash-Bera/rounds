import Image from "next/image";

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-black ${className}`}>
      <Image src="/logo.jpg" alt="" fill sizes="32px" className="object-cover" />
    </span>
  );
}
