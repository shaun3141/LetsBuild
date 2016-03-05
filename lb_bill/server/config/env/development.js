/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

    stormpath:{
        STORMPATH_CLIENT_APIKEY_ID: "3CZQLBCTRICRENBZOB8HJ1627",
        STORMPATH_CLIENT_APIKEY_SECRET: "R32CCacviZpaD0dm6vQQX65bFxG0Taiv+ns7zVYKvq4",
        STORMPATH_APPLICATION_HREF: "https://api.stormpath.com/v1/applications/y4aMb78mCMwNCGy4efqBt"
    },

    crypto: {
        CRYPTO_KEY: 'HpFNfvyWuVMuUK8c'
    }
};
