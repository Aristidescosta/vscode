import * as vscode from 'vscode';

import { configurarDepuracao } from './depuracao/configuracao-depuracao';
import { FabricaAdaptadorDepuracaoEmbutido } from './depuracao/fabricas';
import {
    DeleguaAdapterServerDescriptorFactory,
    DeleguaAdapterNamedPipeServerDescriptorFactory,
    DeleguaDebugAdapterExecutableFactory,
} from './depuracao/fabricas/remotas';
import {
    DeleguaProvedorDocumentacaoEmEditor,
    FolesProvedorDocumentacaoEmEditor,
} from './documentacao-em-editor';
import {
    DeleguaProvedorCompletude,
    FolesProvedorCompletude,
    LiquidoProvedorCompletude,
} from './completude';
import { DeleguaProvedorFormatacao } from './formatadores';
import { VisuAlgProvedorCompletude } from './completude/visualg-provedor-completude';
import { VisuAlgProvedorDocumentacaoEmEditor } from './documentacao-em-editor/visualg-documentacao-em-editor';
import { traduzir } from './traducao';
import { analiseSemantica } from './analise-semantica';

/**
 * Em teoria runMode é uma "compile time flag", mas nunca foi usado aqui desta forma.
 * Usar 'server' para execução remota e 'inline' para execução embutida.
 * Please note: the test suite only supports 'external' mode.
 */
const runMode: 'external' | 'server' | 'namedPipeServer' | 'inline' = 'inline';

export function activate(context: vscode.ExtensionContext) {
    const diagnosticosDelegua = vscode.languages.createDiagnosticCollection("delegua");
	context.subscriptions.push(diagnosticosDelegua);

    if (vscode.window.activeTextEditor) {
		analiseSemantica(vscode.window.activeTextEditor.document, diagnosticosDelegua);
	}

    context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((e) => analiseSemantica(e.document, diagnosticosDelegua))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => diagnosticosDelegua.delete(doc.uri))
	);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.delegua.para.javascript',
            async () => await traduzir('delegua', 'js')
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.delegua.para.python',
            async () => await traduzir('delegua', 'py')
        )
    );

    // TODO: Corrigir o suporte a XSLT para poder ativar essa transformação.
    /* context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.html',
            async () => await traduzir('html', 'lmht')
        )
    ); */

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.javascript.para.delegua',
            async () => await traduzir('js', 'delegua')
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.foles.para.css',
            async () => await traduzir('foles', 'css')
        )
    );

    // TODO: Corrigir o suporte a XSLT para poder ativar essa transformação.
    /* context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.lmht',
            async () => await traduzir('lmht', 'html')
        )
    ); */
    
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.designliquido.traduzir.visualg.para.delegua',
            async () => await traduzir('alg', 'delegua')
        )
    );    

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            'delegua',
            new DeleguaProvedorFormatacao()
        )
    );

    // IntelliSense para Delégua e Liquido.
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'delegua', pattern: 'configuracao.delegua' },
            new LiquidoProvedorCompletude(),
            '.' // acionado quando desenvolvedor/a digita '.'
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'delegua',
            new DeleguaProvedorCompletude()
        )
    );

    // IntelliSense para FolEs
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'foles',
            new FolesProvedorCompletude()
        )
    );

    // IntelliSense para VisuAlg
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'visualg',
            new VisuAlgProvedorCompletude()
        )
    );

    // Hovers
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            'delegua',
            new DeleguaProvedorDocumentacaoEmEditor()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            'foles',
            new FolesProvedorDocumentacaoEmEditor()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            'visualg',
            new VisuAlgProvedorDocumentacaoEmEditor()
        )
    );

    // debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
    switch (runMode) {
        case 'server':
            // run the debug adapter as a server inside the extension and communicate via a socket
            configurarDepuracao(
                context,
                new DeleguaAdapterServerDescriptorFactory()
            );
            break;

        case 'namedPipeServer':
            // run the debug adapter as a server inside the extension and communicate via a named pipe (Windows) or UNIX domain socket (non-Windows)
            configurarDepuracao(
                context,
                new DeleguaAdapterNamedPipeServerDescriptorFactory()
            );
            break;

        case 'external':
        default:
            // run the debug adapter as a separate process
            configurarDepuracao(
                context,
                new DeleguaDebugAdapterExecutableFactory()
            );
            break;

        case 'inline':
            // run the debug adapter inside the extension and directly talk to it
            configurarDepuracao(
                context,
                new FabricaAdaptadorDepuracaoEmbutido()
            );
            break;
    }
}

export function deactivate() {
    // nothing to do
}
