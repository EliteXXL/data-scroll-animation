const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const nodeResolve = require("@rollup/plugin-node-resolve").default;

export default [
    {
        input: "src/index.ts",
        plugins: [
            nodeResolve(),
            typescript(),
            commonjs()
        ],
        output: [
            {
                name: "dataScrollAnimation",
                file: "dist/index.js",
                format: "umd"
            },
            {
                file: "dist/index.es.js",
                format: "es"
            }
        ]
    },
    {
        input: "test/src/main.ts",
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript()
        ],
        output: {
            file: "test/scripts/main.js",
            format: "umd"
        }
    }
];