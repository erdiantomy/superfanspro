import { motion, useSpring, useTransform, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { idr } from "@/data/constants";

function Digit({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const y = useTransform(mv, (v) => `${-v * 100}%`);

  useEffect(() => {
    animate(mv, value, { type: "spring", stiffness: 200, damping: 20 });
  }, [value, mv]);

  return (
    <span className="inline-block relative overflow-hidden" style={{ height: "1em", width: "0.62em" }}>
      <motion.span className="absolute left-0 top-0 flex flex-col" style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span key={d} className="block text-center" style={{ height: "1em", lineHeight: "1em" }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function Odometer({ value, className = "" }: { value: number; className?: string }) {
  const formatted = idr(value);

  return (
    <span className={`inline-flex items-center ${className}`}>
      {formatted.split("").map((char, i) => {
        const digit = parseInt(char, 10);
        if (!isNaN(digit)) {
          return <Digit key={i} value={digit} />;
        }
        return (
          <span key={i} className="inline-block" style={{ width: char === " " ? "0.3em" : undefined }}>
            {char}
          </span>
        );
      })}
    </span>
  );
}
