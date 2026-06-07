import { Theme } from '../types';

export const getThemeConfettiColors = (theme: Theme): string[] => {
  switch (theme) {
    case 'plain_white':
      return ['#3b82f6', '#10b981', '#71717a', '#27272a'];
    case 'plain_dark':
      return ['#06b6d4', '#a855f7', '#a1a1aa', '#f4f4f5'];
    case 'matrix':
      return ['#22c55e', '#15803d', '#86efac', '#14532d'];
    case 'vaporwave':
      return ['#ff71ce', '#b967ff', '#05ffa1', '#fffb96'];
    case 'westeros':
      return ['#dc2626', '#d97706', '#ea580c', '#f59e0b'];
    case 'sakura':
      return ['#ffb7c5', '#ff9999', '#ffccd5', '#ffffff'];
    case 'lcars':
      return ['#ff9900', '#cc99cc', '#ffcc00', '#99ccff'];
    case 'frutiger_aero':
      return ['#00ccff', '#33cc33', '#ffcc00', '#ff6600'];
    case 'synthwave':
      return ['#ff0055', '#7a04eb', '#ff8400', '#120458'];
    case 'heavy_metal':
      return ['#8b0000', '#333333', '#cccccc', '#ff0000'];
    case 'post_punk':
      return ['#1a1a1a', '#4a4a4a', '#8a8a8a', '#e0e0e0'];
    case 'rock_legends':
      return ['#d4af37', '#cd7f32', '#b87333', '#333333'];
    case 'kraftwerk':
      return ['#e50914', '#111111', '#888888', '#ffffff'];
    case 'default':
    default:
      return ['#8b5cf6', '#ec4899', '#fbbf24'];
  }
};
