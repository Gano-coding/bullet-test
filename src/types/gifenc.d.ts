declare module "gifenc" {
  export type QuantizeOptions = {
    format?: "rgb565" | "rgb444" | "rgba4444";
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  };

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string
  ): Uint8Array;

  export type GIFEncoderOptions = {
    auto?: boolean;
  };

  export type WriteFrameOptions = {
    palette?: number[][];
    first?: boolean;
    transparent?: boolean | number;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
  };

  export type GIFEncoderInstance = {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    buffer: ArrayBuffer;
  };

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
}
