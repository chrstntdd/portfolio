import "./index.scss";
import { Main } from "./Main.elm";

const app = Main.embed(document.getElementById("elm-root"));

app.ports.infoForOutside.subscribe(msg => {
  /* PATTERN MATCH ON THE INFO FOR OUTSIDE */
  switch (msg.tag) {
    case "SaveModel":
    case "GetElementOffsetTop":
    case "SetScrollTop":
  }
});
