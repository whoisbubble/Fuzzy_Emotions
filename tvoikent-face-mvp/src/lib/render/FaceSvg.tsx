import type { FaceState } from "@/lib/fuzzy-core/types";

type Props = {
  face: FaceState | null;
};

const neutralFace: FaceState = {
  browRaise: { power: 0, lcr: 0.5 },
  browLower: { power: 0, lcr: 0.5 },
  eyeOpen: { power: 0, lcr: 0.5 },
  eyeSquint: { power: 0, lcr: 0.5 },
  smile: { power: 0, lcr: 0.5 },
  mouthDown: { power: 0, lcr: 0.5 },
  lipPress: { power: 0, lcr: 0.5 },
  jawDrop: { power: 0, lcr: 0.5 },
  asymmetry: { power: 0, lcr: 0.5 },
};

export function FaceSvg({ face }: Props) {
  const f = face ?? neutralFace;

  const browRaise = f.browRaise.power;
  const browLower = f.browLower.power;
  const eyeOpen = f.eyeOpen.power;
  const eyeSquint = f.eyeSquint.power;
  const smile = f.smile.power;
  const mouthDown = f.mouthDown.power;
  const lipPress = f.lipPress.power;
  const jawDrop = f.jawDrop.power;
  const asymmetry = f.asymmetry.power;
  const lcr = f.asymmetry.lcr;

  const browY = 74 - browRaise * 12 + browLower * 10;
  const browAngle = browLower * 8 - browRaise * 3;

  const eyeRy = Math.max(2, 8 + eyeOpen * 8 - eyeSquint * 6);

  const asymDirection = lcr >= 0.5 ? 1 : -1;
  const asymOffset = asymmetry * 14 * asymDirection;

  const leftMouthY = 137 - smile * 20 + mouthDown * 18 + jawDrop * 8;
  const rightMouthY =
    137 - smile * 20 + mouthDown * 18 + jawDrop * 8 - asymOffset;

  const mouthCenterY =
    142 + jawDrop * 22 + mouthDown * 6 - smile * 6 + lipPress * 3;

  const mouthWidth = 40 + smile * 18 - lipPress * 14;

  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 220 220"
      className="rounded-3xl bg-zinc-100 shadow-inner"
    >
      <circle cx="110" cy="110" r="78" fill="#f0c7a8" stroke="#18181b" strokeWidth="4" />

      <line
        x1="58"
        y1={browY + browAngle}
        x2="92"
        y2={browY - browAngle}
        stroke="#18181b"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <line
        x1="128"
        y1={browY - browAngle}
        x2="162"
        y2={browY + browAngle}
        stroke="#18181b"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <ellipse cx="75" cy="96" rx="13" ry={eyeRy} fill="white" stroke="#18181b" strokeWidth="3" />
      <ellipse cx="145" cy="96" rx="13" ry={eyeRy} fill="white" stroke="#18181b" strokeWidth="3" />

      <circle cx="75" cy="96" r="4" fill="#18181b" />
      <circle cx="145" cy="96" r="4" fill="#18181b" />

      <path
        d={`M ${110 - mouthWidth} ${leftMouthY} Q 110 ${mouthCenterY} ${110 + mouthWidth} ${rightMouthY}`}
        fill="none"
        stroke="#18181b"
        strokeWidth={lipPress > 0.45 ? 7 : 5}
        strokeLinecap="round"
      />

      <line
        x1="110"
        y1="105"
        x2="105"
        y2={122 + f.jawDrop.power * 4}
        stroke="#18181b"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}