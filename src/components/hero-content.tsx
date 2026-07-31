"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function HeroContent() {
  return (
    <motion.div
      className="max-w-xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={item}
        className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl"
      >
        Every shift covered. No spreadsheet required.
      </motion.h1>
      <motion.p variants={item} className="mt-5 max-w-md text-white/70">
        Rounds turns your clinic&apos;s messy shift spreadsheet into a live schedule. Staff claim
        their own shifts, managers see exactly who&apos;s missing, and the rules — headcount,
        overlap, no double-booking — hold up no matter how many people are clicking at once.
      </motion.p>
      <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="lg"
          className="gap-1.5 rounded-full border border-white/40 bg-transparent text-white hover:bg-white/10"
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
