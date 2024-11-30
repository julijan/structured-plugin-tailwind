import { Application } from 'structured-fw/Application';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { tailwindConfig } from './tailwind.config.js';

export async function structuredTailwind(app: Application): Promise<void> {

    // generate Tailwind base CSS (included to all documents)
    const baseCSS = await generateBaseCSS();

    // ComponentName -> CSS
    const css: Record<string, string | undefined> = {}

    // after components are loaded, generate their css using postcss/tailwind
    app.on('afterComponentsLoaded', async (components) => {
        for (let i = 0; i < components.componentNames.length; i++) {
            const componentName = components.componentNames[i];
            const component = components.getByName(componentName);
            if (component) {
                css[componentName] = await generateComponentCSS(component.html);
            }
        }
    });

    // add component css to document head for each loaded component
    app.on('documentCreated', (document) => {

        // add Tailwind base CSS
        document.head.add(`<style type="text/css">${baseCSS}</style>`);

        // on each component create, add it's generated CSS
        const componentsIncluded: Array<string> = [];
        document.on('componentCreated', (component) => {
            const componentCSS = css[component.name];
            const hasCSS = typeof componentCSS === 'string' && componentCSS.length > 0;
            if (hasCSS && ! componentsIncluded.includes(component.name)) {
                document.head.add(`
                <style type="text/css">
                    ${css[component.name]}
                </style>
                `);
                componentsIncluded.push(component.name);
            }
        });
    });
}

async function generateComponentCSS(html: string): Promise<string> {
    const sourceCSS = '@tailwind components; @tailwind utilities;';
    const config = {
        presets: [tailwindConfig],
        content: [{ raw: html }]
    };
    return (await postcss([tailwindcss(config)]).process(sourceCSS)).css;
}

async function generateBaseCSS(): Promise<string> {
    const sourceCSS = '@tailwind base;';
    const config = {
        presets: [tailwindConfig],
        content: [{ raw: '' }]
    };
    return (await postcss([tailwindcss(config)]).process(sourceCSS)).css;
}