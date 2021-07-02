import { app } from '../line-web-hook/app';


const port = process.env.PORT ?? 8080;
app.listen(port, () => {
    console.log(`Curvyhouses webhook listening at http://localhost:${port}`);
});
