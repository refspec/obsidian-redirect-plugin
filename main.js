const { Plugin, Notice, TFile, MarkdownView, WorkspaceLeaf } = require('obsidian');

class RedirectPlugin extends Plugin {
    onload() {
        console.log("Redirect Plugin loaded");

        this.addCommand({
            id: 'toggle-redirect',
            name: 'Toggle Redirect',
            callback: () => this.toggleRedirect(),
        });

        this.isRedirectEnabled = true;

        this.registerEvent(this.app.workspace.on('active-leaf-change', this.handleRedirect.bind(this)));
    }

    toggleRedirect() {
        this.isRedirectEnabled = !this.isRedirectEnabled;
        new Notice(`Redirect is now ${this.isRedirectEnabled ? 'enabled' : 'disabled'}.`);
    }

    async handleRedirect(leaf) {
        if (!this.isRedirectEnabled || !leaf) {
            return;
        }
        
        if (!(leaf.view instanceof MarkdownView)) {
            return;
        }
        
        const file = leaf.view.file;
        if (!file) {
            return;
        }

        const fileCache = this.app.metadataCache.getFileCache(file);
        if (!fileCache || !fileCache.frontmatter) {
            return;
        }

        const redirectTarget = fileCache.frontmatter.redirect_to;
        if (redirectTarget) {
            console.log(`Redirect found in "${file.basename}". Target: "${redirectTarget}"`);
            this.redirectToFile(redirectTarget, leaf);
        }
    }

    async redirectToFile(targetNote, leaf) {
        const sourceFile = leaf.view.file; 
        const targetFilePath = this.findFilePathByName(targetNote);

        if (!targetFilePath) {
            this.showFileNotFoundNotice(targetNote);
            return;
        }

        if (sourceFile && sourceFile.path === targetFilePath) {
            console.log("Redirect target is the same as the source file. Aborting to prevent loop.");
            return;
        }

        const targetFile = this.app.vault.getAbstractFileByPath(targetFilePath);
        if (!(targetFile instanceof TFile)) {
            this.showFileNotFoundNotice(targetNote);
            return;
        }

        console.log(`Executing redirect: Opening "${targetFilePath}" in the current leaf.`);
        
        await leaf.openFile(targetFile);
        new Notice(`Redirected to "${targetNote}".`);
    }


    findFilePathByName(name) {
        const files = this.app.vault.getMarkdownFiles();
        const foundFile = files.find(file => file.basename === name);
        if (foundFile) {
            return foundFile.path;
        }
        console.log(`Redirect: File with name "${name}" not found`);
        return null;
    }

    showFileNotFoundNotice(targetNote) {
        new Notice(`Redirect: Target note "${targetNote}" not found.`);
        console.log(`Redirect: Target note "${targetNote}" not found`);
    }
}

module.exports = RedirectPlugin;