import { load } from "cheerio";

const htmlFromREADME = `
<section>
  <h1>Heading 1</h1>
  <section>
    <h2>Heading 2</h2>
    <h2>Another Heading 2</h2>
    <section>
      <h3>Heading 3</h3>
      <section>
        <h4>Heading 4</h4>
        <section>
          <h2>An out of place Heading 2</h2>
          <h5>Heading 5</h5>
        </section>
      </section>
    </section>
  </section>
</section>
`;

const $ = load(htmlFromREADME);

const htmlHeadings = $("h1, h2, h3, h4, h5, h6");

const headings = [];
const stack = [];

for (const header of htmlHeadings) {
  const headerTag = header.name;
  const headerText = $(header).text();
  const curLevel = parseInt(headerTag.charAt(1));

  const node = {
    tag: headerTag,
    content: headerText,
    children: [],
  };

  // pop stack until we find a parent with a smaller level
  while (stack.length > 0) {
    const topLevel = parseInt(stack.at(-1).tag.charAt(1));
    if (topLevel < curLevel) break;
    stack.pop();
  }

  // check if root
  if (stack.length === 0) {
    headings.push(node);
  } else {
    stack.at(-1).children.push(node);
  }

  stack.push(node);
}

console.dir(headings, { depth: null });
