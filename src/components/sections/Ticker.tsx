import React from 'react';

const items = [
  'TOSTADAS', 'BURRITOS', 'BOWLS', 'NACHOS',
  'QUESADILLAS', 'FLAUTAS', 'CHILI TEXMEX', 'COMBO PACKS',
];

export default function Ticker() {
  return (
    <div
      className="bg-yellow text-black py-3.5 overflow-hidden whitespace-nowrap select-none"
      aria-hidden="true"
    >
      <div className="inline-flex gap-8 animate-ticker">
        {Array.from({ length: 3 }).map((_, repeat) => (
          <React.Fragment key={repeat}>
            {items.map((item, i) => (
              <React.Fragment key={`${repeat}-${i}`}>
                <span className="font-display text-xl md:text-2xl tracking-[3px]">
                  {item}
                </span>
                <span className="font-display text-xl md:text-2xl tracking-[3px] opacity-40">
                  ·
                </span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
