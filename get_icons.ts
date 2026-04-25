import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Eclipse, Sun, SunDim, Sunset, MoonStar } from 'lucide-react';

console.log("Eclipse:", renderToStaticMarkup(createElement(Eclipse)));
console.log("Sun:", renderToStaticMarkup(createElement(Sun)));
console.log("SunDim:", renderToStaticMarkup(createElement(SunDim)));
console.log("Sunset:", renderToStaticMarkup(createElement(Sunset)));
console.log("MoonStar:", renderToStaticMarkup(createElement(MoonStar)));
