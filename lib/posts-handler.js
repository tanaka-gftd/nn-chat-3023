'use strict';
const pug = require('pug');
const Post = require('./post');
const util = require('./handler-util');

async function handle(req, res) {
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      const posts = await Post.findAll({order:[['id', 'DESC']]});
      res.end(pug.renderFile('./views/posts.pug', { posts, user: req.user }));
      break;
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const content = params.get('content');
        console.info(`送信されました: ${content}`);
        await Post.create({
          content,
          postedBy: req.user
        });
        handleRedirectPosts(req, res);
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

//書き込みを削除する関数
function handleDelete(req, res) {

  //switch文でPOSTメソッドの時だけ、削除処理が行われるようにする
  switch(req.method) {
    case 'POST':

      /* POSTされてきたデータを受け取り、URIデコードして、投稿文のIDを取得 */
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async() => {
        const params = new URLSearchParams(body);
        const id = params.get('id');

        //投稿文のIDを元に、データベースから投稿を取得
        const post = await Post.findByPk(id);

        //投稿内容を削除しようとしているのが投稿者本人のものなのかを確認してから、データベース上のレコードを削除
        if(req.user === post.postedBy) {
          await post.destroy();
          handleRedirectPosts(req, res);
        }
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

module.exports = {
  handle,
  handleDelete
};
