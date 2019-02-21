
function assert (expr) {
  if (!expr) throw new Error('failed');
}

describe("utils", function() {
  describe("window.utils", function() {
    it("should be present", function() {
      assert('object' === typeof window.utils);
    })
  })

  describe("utils.parseComment", function() {
    it("should return an object with a `title` and a `body`", function() {
      var source = '/*\n * hello\n *\n * just a summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);
    })

    it("should handle variations", function() {
      var source = '/* hello */\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert(''===item.body);

      var source = '/**\n hello\n */\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert(''===item.body);

      var source = '/* hello\n\n * just a summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);

      var source = '/** hello\n\n * just a summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);

      var source = '/*\n * hello\n *\n * just a summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);

      var source = '/**\n * hello\n *\n * just a summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);

      var source = '/**\n * hello\n *\n * just a summary\n * multiline one\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary\nmultiline one'===item.body);

      var source = '/*\n * hello\n *\n * just a summary\n */\n\n there';
      source = source + '\n\n/*\n * another\n *\n * another summary\n */\n\n there';
      var item = utils.parseComment(source);
      assert('hello'===item.title);
      assert('just a summary'===item.body);
    })
  })
})
