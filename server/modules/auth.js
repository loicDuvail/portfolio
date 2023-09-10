const Sessions = require("./sessions");

function auth(privatePaths = [], redirects = []) {
    return (req, res, next) => {
        if (!matchInsideArr(req.path, privatePaths)) return next();

        const { session_id } = req.cookies;
        if (Sessions.isLoggedIn(session_id)) return next();

        //if path private and client not recognized, redirect to corresponding path

        const privatePath = privatePaths.find(
            (path) => path === req.path.substring(0, path.length)
        );
        const pathIndex = privatePaths.indexOf(privatePath);
        const redirectionPath = redirects[pathIndex];

        if (!redirectionPath)
            return res
                .status(401)
                .send({ error: "Forbidden, client not recognized" });

        res.redirect(302, redirectionPath);
    };
}

//returns true if any element inside array match with
//the start of the value (substring(0,element.length))
function matchInsideArr(value, array) {
    for (const el of array) {
        if (el === value.substring(0, el.length)) return true;
    }
    return false;
}

module.exports = auth;
