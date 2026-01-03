'use client';

/**
 * Suppress specific react-spring SVG transform errors in development.
 * 
 * This is a known bug in Nivo 0.99 + react-spring 10.x where the animation
 * engine generates malformed SVG transform strings like "translate(,)" during
 * interpolation when container dimensions are not yet calculated.
 * 
 * The charts still work and animate correctly - this just silences the console
 * spam. These errors don't affect functionality.
 * 
 * @see https://github.com/plouc/nivo/issues/2242
 */

if (typeof window !== 'undefined') {
    const originalError = console.error;

    console.error = (...args: unknown[]) => {
        // Suppress react-spring SVG transform parsing errors
        const message = args[0];
        if (
            typeof message === 'string' &&
            message.includes('attribute transform') &&
            message.includes("Expected ')'") &&
            message.includes('translate')
        ) {
            // Silently ignore these specific errors
            return;
        }

        // Also suppress the Error object version
        if (
            message instanceof Error &&
            message.message?.includes('attribute transform') &&
            message.message?.includes("Expected ')'")
        ) {
            return;
        }

        originalError.apply(console, args);
    };
}

export { };
