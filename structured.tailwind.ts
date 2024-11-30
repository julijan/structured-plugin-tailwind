import { Application } from 'structured-fw/Application';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { tailwindConfig } from './tailwind.config.js';

export function plugin(app: Application): void {

    // ComponentName -> CSS
    const css: Record<string, string> = {}

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
        const componentsIncluded: Array<string> = [];
        document.on('componentCreated', (component) => {
            if (! componentsIncluded.includes(component.name)) {
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
    const sourceCSS = '@tailwind base; @tailwind components; @tailwind utilities;';
    const config = {
        presets: [tailwindConfig],
        content: [{ raw: html }]
    };
    return (await postcss([tailwindcss(config)]).process(sourceCSS)).css;
}