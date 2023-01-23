import * as vscode from 'vscode';

import { DeleguaSessaoDepuracaoLocal } from '../delegua-sessao-depuracao-local';

export class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

	createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
		// return new vscode.DebugAdapterInlineImplementation(new DeleguaSessaoDepuracao(workspaceFileAccessor));
        return new vscode.DebugAdapterInlineImplementation(new DeleguaSessaoDepuracaoLocal());
	}
}