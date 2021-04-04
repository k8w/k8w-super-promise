import typescript from 'rollup-plugin-typescript2';

export default [
    {
        input: './src/index.ts',
        output: [
            {
                format: 'cjs',
                file: './dist/index.cjs',
            }
        ],
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'es3'
                    }
                }
            })
        ],
        external: ['core-js/es/promise/finally']
    },
    {
        input: './src/index.ts',
        output: [
            {
                format: 'es',
                file: './dist/index.mjs',
            }
        ],
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'es6'
                    }
                }
            })
        ],
        external: ['core-js/es/promise/finally']
    }
]