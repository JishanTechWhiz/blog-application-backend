// App Routing Class : Main Point
class routing{

    //Routes function : V1
    v1(app){
        const user = require('./v1/user/route/user.routes');
        const post = require('./v1/post/route/post.routes');
        const comment = require('./v1/comment/route/comment.routes');
        user(app);
        post(app);
        comment(app);
    }
}

module.exports = new routing();