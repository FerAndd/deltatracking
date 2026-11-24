/** Muestra los datos que recibiría Claude para los resúmenes de esta semana (para revisar). */
import { previewInputs } from "../lib/summaries";

previewInputs()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
