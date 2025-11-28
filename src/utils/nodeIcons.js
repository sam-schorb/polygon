import bell from '../images/bell.png';
import block from '../images/block.png';
import clap from '../images/clap.png';
import hat from '../images/hat.png';
import kick from '../images/kick.png';
import snare from '../images/snare.png';
import lips from '../images/lips.png';
import bell1 from '../images/bell1.png';
import bird from '../images/bird.png';
import keys from '../images/keys.png';
import bubble from '../images/bubble.png';
import grasshopper from '../images/grasshopper.png';

const ICON_MAP = {
  drums: {
    red: kick,
    green: snare,
    pink: bell,
    purple: clap,
    orange: hat,
    blue: block,
  },
  synth: {
    green: lips,
    orange: bell1,
    red: bird,
    purple: keys,
    blue: bubble,
    pink: grasshopper,
  },
};

export const getNodeIcon = (colorKey, soundBank = 'drums') => {
  const bankIcons = ICON_MAP[soundBank] || {};
  return bankIcons[colorKey] || ICON_MAP.drums[colorKey] || null;
};

export default ICON_MAP;
