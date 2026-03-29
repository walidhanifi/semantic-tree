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

const output = $("h1,h2,h3,h4,h5,h6").text();

console.log(output); // TODO: will remove later, just for testing library
