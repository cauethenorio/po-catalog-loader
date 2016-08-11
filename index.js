var gettextParser = require('gettext-parser');
var loaderUtils = require('loader-utils');

function isEmptyMessage(msg) {
  for (var i = 0; i < msg.msgstr.length; i++) {
    if (msg.msgstr[i] === '' || msg.msgstr[i] === null) {
      return true;
    }
  }
  return false;
}

function messageIsExcluded(msg, extensions) {
  if (!extensions) {
    return false;
  }

  var references = ((msg.comments || {}).reference || '<unknown>').split(/\n/);

  for (var i = 0; i < references.length; i++) {
    var filename = references[i].split(/:/)[0];
    for (var j = 0; j < extensions.length; j++) {
      var ext = extensions[j];
      if (filename.substr(filename.length - ext.length) == ext) {
        return false;
      }
    }
  }

  return true;
}

module.exports = function(source) {
  var options = loaderUtils.parseQuery(this.query);
  var catalog = gettextParser.po.parse(source, 'UTF-8');

  this.cacheable();

  var rv = {};

  for (var context in catalog.translations) {
    if (!catalog.translations.hasOwnProperty(context)) {
      continue;
    }

    for (var msgid in catalog.translations[context]) {
      if (msgid === '') {
        continue;
      }

      var msg = catalog.translations[context][msgid];

      if (!isEmptyMessage(msg) &&
          !messageIsExcluded(msg, options.referenceExtensions)) {
        if (context !== '' && options.addJedContext) {
          rv[context + '\u0004' + msgid] = msg.msgstr;
        } else {
          rv[msgid] = msg.msgstr;
        }

      }
    }

  }


  rv[''] = {
    domain: options.domain || 'messages',
    plural_forms: catalog.headers['plural-forms'],
    lang: catalog.headers['language'],
  };

  if (options.raw) {
    return rv;
  } else if (options.json) {
      return JSON.stringify(rv);
  }

  return 'module.exports = ' + JSON.stringify(rv) + ';';
};