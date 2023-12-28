import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'sharedWorker.js', // Entry point for your bundle
    output: {
        file: 'bundle.js', // Output bundle file
        format: 'iife', // Bundle format - 'iife' for browser
        name: 'myModule' // Reference name for your bundle
    }
};
