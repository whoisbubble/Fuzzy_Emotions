import type { FaceState } from "@/lib/fuzzy-core/types";

type Props = {
  face: FaceState | null;
};

const neutralFace: FaceState = {
  browRaise: { power: 0, lcr: 0.5 },
  browLower: { power: 0, lcr: 0.5 },
  singleBrowRaise: { power: 0, lcr: 0.24 },
  eyeOpen: { power: 0, lcr: 0.5 },
  eyeSquint: { power: 0, lcr: 0.5 },
  smile: { power: 0, lcr: 0.5 },
  mouthDown: { power: 0, lcr: 0.5 },
  lipPress: { power: 0, lcr: 0.5 },
  upperLipRaise: { power: 0, lcr: 0.5 },
  jawDrop: { power: 0, lcr: 0.5 },
  mouthRound: { power: 0, lcr: 0.5 },
  mouthStretch: { power: 0, lcr: 0.5 },
  asymmetry: { power: 0, lcr: 0.5 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mix(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function FaceSvg({ face }: Props) {
  const f = face ?? neutralFace;

  const faceCx = 140;
  const faceCy = 145;
  const faceRx = 82;
  const faceRy = 97;

  const browRaise = clamp(f.browRaise.power, 0, 1);
  const browLower = clamp(f.browLower.power, 0, 1);
  const singleBrowRaise = clamp(f.singleBrowRaise.power, 0, 1);
  const eyeOpen = clamp(f.eyeOpen.power, 0, 1);
  const eyeSquint = clamp(f.eyeSquint.power, 0, 1);
  const smile = clamp(f.smile.power, 0, 1);
  const mouthDown = clamp(f.mouthDown.power, 0, 1);
  const lipPress = clamp(f.lipPress.power, 0, 1);
  const upperLipRaise = clamp(f.upperLipRaise.power, 0, 1);
  const jawDrop = clamp(f.jawDrop.power, 0, 1);
  const mouthRound = clamp(f.mouthRound.power, 0, 1);
  const mouthStretch = clamp(f.mouthStretch.power, 0, 1);
  const asymmetry = clamp(f.asymmetry.power, 0, 1);

  const asymmetryDirection = f.asymmetry.lcr >= 0.5 ? 1 : -1;
  const sneerDirection = f.upperLipRaise.lcr >= 0.5 ? 1 : -1;
  const singleBrowDirection = f.singleBrowRaise.lcr >= 0.5 ? 1 : -1;
  const asymmetryShift = asymmetryDirection * asymmetry * 7;

  const browBaseY = 88 - browRaise * 10.8 + browLower * 1.8;
  const leftBrowLift = (singleBrowDirection < 0 ? 1 : 0.28) * singleBrowRaise * 13;
  const rightBrowLift = (singleBrowDirection > 0 ? 1 : 0.28) * singleBrowRaise * 13;
  const leftBrowOuterY =
    browBaseY - browLower * 2.8 - browRaise * 1.9 - leftBrowLift * 0.2 - asymmetryShift * 0.08;
  const leftBrowInnerY = browBaseY + browLower * 8.2 - browRaise * 0.5 - leftBrowLift;
  const rightBrowOuterY =
    browBaseY - browLower * 2.8 - browRaise * 1.9 - rightBrowLift * 0.2 + asymmetryShift * 0.08;
  const rightBrowInnerY = browBaseY + browLower * 8.2 - browRaise * 0.5 - rightBrowLift;

  const eyeY = 118 - eyeOpen * 0.8 + eyeSquint * 0.6;
  const eyeHeightBase = 6.2 + eyeOpen * 6.2 - eyeSquint * 3.9 - browLower * 0.9;
  const leftEyeHeight = clamp(
    eyeHeightBase + (singleBrowDirection < 0 ? 1.1 : -0.35) * singleBrowRaise,
    2.4,
    11.6
  );
  const rightEyeHeight = clamp(
    eyeHeightBase + (singleBrowDirection > 0 ? 1.1 : -0.35) * singleBrowRaise,
    2.4,
    11.6
  );
  const leftLidY = eyeY - 7.6 - leftBrowLift * 0.12 - eyeSquint * 1.5;
  const rightLidY = eyeY - 7.6 - rightBrowLift * 0.12 - eyeSquint * 1.5;
  const irisShiftY = -eyeOpen * 0.9 + browLower * 0.45 + eyeSquint * 0.1;

  const warmth = clamp(smile * 0.85 + eyeSquint * 0.2 - mouthDown * 0.25, 0, 1);
  const cheekLift = smile * 4 - mouthDown * 1.2;
  const blushOpacity = clamp(
    0.14 + warmth * 0.09 + singleBrowRaise * 0.04 - upperLipRaise * 0.03,
    0.14,
    0.32
  );

  const smileCurve = clamp(
    smile * 1.25 - upperLipRaise * 1.3 - mouthDown * 0.95 - lipPress * 0.35,
    0,
    1
  );
  const frownCurve = clamp(
    mouthDown * 1.12 + upperLipRaise * 0.5 + lipPress * 0.18 - smile * 0.78,
    0,
    1
  );
  const sneerCurve = clamp(
    upperLipRaise * 1.08 + asymmetry * 0.6 + mouthStretch * 0.2 - smile * 0.8,
    0,
    1
  );
  const lipSeal = clamp(lipPress * 1.05 + mouthRound * 0.25, 0, 1);

  const mouthBaseY = 177;
  const mouthWidth = clamp(
    33 + mouthStretch * 10 + smileCurve * 6 - lipSeal * 8 - sneerCurve * 4,
    24,
    46
  );
  const leftCornerX = faceCx - mouthWidth;
  const rightCornerX = faceCx + mouthWidth;
  const commonCornerY = mouthBaseY + frownCurve * 4.8 - smileCurve * 4.6 + lipSeal * 0.9;
  const leftSneerLift =
    (sneerDirection < 0 ? 1 : 0.18) * sneerCurve * 11 +
    (asymmetryDirection < 0 ? 1 : 0.22) * asymmetry * 4.4;
  const rightSneerLift =
    (sneerDirection > 0 ? 1 : 0.18) * sneerCurve * 11 +
    (asymmetryDirection > 0 ? 1 : 0.22) * asymmetry * 4.4;
  const leftCornerY = commonCornerY - leftSneerLift;
  const rightCornerY = commonCornerY - rightSneerLift;
  const centerX = faceCx + asymmetryDirection * asymmetry * 3.2;
  const centerY = clamp(
    mouthBaseY +
      smileCurve * 11 -
      frownCurve * 10 -
      sneerCurve * 1.5 +
      lipSeal * 1.8 +
      mouthStretch * 0.4,
    Math.min(leftCornerY, rightCornerY) - 13,
    Math.max(leftCornerY, rightCornerY) + 13
  );
  const leftControlX = mix(leftCornerX, centerX, 0.48);
  const rightControlX = mix(rightCornerX, centerX, 0.48);
  const leftControlY = mix(leftCornerY, centerY, 0.72);
  const rightControlY = mix(rightCornerY, centerY, 0.72);
  const mouthStroke = lipSeal > 0.55 ? 6.2 : sneerCurve > 0.45 ? 5.4 : 4.8;
  const mouthOpening = clamp(
    jawDrop * 0.95 +
      mouthRound * 0.8 +
      mouthStretch * 0.12 -
      upperLipRaise * 0.45 -
      mouthDown * 0.34 -
      lipSeal * 0.58,
    0,
    1
  );
  const shouldUseOpenMouth = mouthOpening > 0.1;
  const openMouthCx = faceCx + asymmetryDirection * asymmetry * 1.5;
  const openMouthCy = mouthBaseY + jawDrop * 1.8 - smileCurve * 0.8 + frownCurve * 0.5;
  const openMouthRx = clamp(mouthWidth * (0.68 + mouthRound * 0.18), 18, 34);
  const openMouthRy = clamp(2.8 + mouthOpening * 12 + mouthRound * 5.5, 2.8, 18);

  return (
    <svg
      width="360"
      height="360"
      viewBox="0 0 280 280"
      className="h-auto w-full max-w-[360px]"
      role="img"
      aria-label="Generated emotional face"
    >
      <defs>
        <linearGradient id="stageGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff4b8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffc49d" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#e78267" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="faceGlow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#ffe6d3" />
          <stop offset="70%" stopColor="#f0bc9d" />
          <stop offset="100%" stopColor="#dc9470" />
        </radialGradient>
      </defs>

      <rect x="8" y="8" width="264" height="264" rx="36" fill="#0b1220" />
      <circle cx={faceCx} cy="140" r="102" fill="url(#stageGlow)" opacity="0.18" />

      <ellipse
        cx={faceCx}
        cy={faceCy}
        rx={faceRx}
        ry={faceRy}
        fill="url(#faceGlow)"
        stroke="#241813"
        strokeWidth="4"
      />

      <ellipse cx="96" cy={144 - cheekLift} rx="16" ry="8.5" fill="#e38e7e" opacity={blushOpacity} />
      <ellipse cx="184" cy={144 - cheekLift} rx="16" ry="8.5" fill="#e38e7e" opacity={blushOpacity} />

      <line
        x1="86"
        y1={leftBrowOuterY}
        x2="121"
        y2={leftBrowInnerY}
        stroke="#23140f"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="159"
        y1={rightBrowInnerY}
        x2="194"
        y2={rightBrowOuterY}
        stroke="#23140f"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <ellipse cx="102" cy={eyeY} rx="17.5" ry={leftEyeHeight} fill="#fffdf9" stroke="#241813" strokeWidth="3" />
      <ellipse cx="178" cy={eyeY} rx="17.5" ry={rightEyeHeight} fill="#fffdf9" stroke="#241813" strokeWidth="3" />

      <path
        d={`M 85 ${leftLidY} Q 102 ${leftLidY - 4 - browLower * 1.3} 119 ${leftLidY}`}
        fill="none"
        stroke="#241813"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d={`M 161 ${rightLidY} Q 178 ${rightLidY - 4 - browLower * 1.3} 195 ${rightLidY}`}
        fill="none"
        stroke="#241813"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.78"
      />

      <circle cx="102" cy={eyeY + irisShiftY} r="5.4" fill="#1d130f" />
      <circle cx="178" cy={eyeY + irisShiftY} r="5.4" fill="#1d130f" />
      <circle cx="104" cy={eyeY - 2 + irisShiftY} r="1.4" fill="#ffffff" />
      <circle cx="180" cy={eyeY - 2 + irisShiftY} r="1.4" fill="#ffffff" />

      <path
        d={`M ${faceCx + 2} 128 Q ${faceCx - 4 - asymmetryShift * 0.12} 145 ${faceCx + 1} 161`}
        fill="none"
        stroke="#6e4639"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />

      {shouldUseOpenMouth ? (
        <ellipse
          cx={openMouthCx}
          cy={openMouthCy}
          rx={openMouthRx}
          ry={openMouthRy}
          fill="none"
          stroke="#241813"
          strokeWidth={mouthStroke}
        />
      ) : (
        <path
          d={`M ${leftCornerX} ${leftCornerY} Q ${leftControlX} ${leftControlY} ${centerX} ${centerY} Q ${rightControlX} ${rightControlY} ${rightCornerX} ${rightCornerY}`}
          fill="none"
          stroke="#241813"
          strokeWidth={mouthStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
