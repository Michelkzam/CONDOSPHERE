
        // Save customized company details
        function applyCompanyDetails(c) {
            if (!c) return;
            if (document.getElementById('comp-razao')) document.getElementById('comp-razao').value = c.razao_social || "";
            if (document.getElementById('comp-fantasia')) document.getElementById('comp-fantasia').value = c.nome_fantasia || "";
            if (document.getElementById('comp-cnpj')) document.getElementById('comp-cnpj').value = c.cnpj || "";
            if (document.getElementById('comp-ie')) document.getElementById('comp-ie').value = c.inscricao_estadual || "";
            if (document.getElementById('comp-endereco')) document.getElementById('comp-endereco').value = c.endereco || "";
            if (document.getElementById('comp-responsavel')) document.getElementById('comp-responsavel').value = c.responsavel_legal || "";
            if (document.getElementById('comp-telefone')) document.getElementById('comp-telefone').value = c.telefone || "";
            
            currentSystemName = c.nome_fantasia || "CondoSphere";
            document.getElementById('brand-system-name').innerText = currentSystemName;
            
            if (c.logo_base64) {
                currentLogoData = c.logo_base64;
                document.getElementById('logo-preview-box').src = c.logo_base64;
                const sideLogo = document.getElementById('brand-logo-img');
                if (sideLogo) sideLogo.src = c.logo_base64;
            }
            
            // Update other print headers
            if (document.getElementById('print-header-association')) document.getElementById('print-header-association').innerText = currentSystemName;
            if (document.getElementById('print-header-association-2')) document.getElementById('print-header-association-2').innerText = currentSystemName;
            if (document.getElementById('print-header-razao')) document.getElementById('print-header-razao').innerText = c.razao_social || "";
            if (document.getElementById('print-header-razao-2')) document.getElementById('print-header-razao-2').innerText = c.razao_social || "";
            if (document.getElementById('print-header-cnpj')) document.getElementById('print-header-cnpj').innerText = c.cnpj || "";
            if (document.getElementById('print-header-cnpj-2')) document.getElementById('print-header-cnpj-2').innerText = c.cnpj || "";
            
            if (document.getElementById('pdf-report-brand-name')) document.getElementById('pdf-report-brand-name').innerText = currentSystemName;
            if (document.getElementById('pdf-report-razao-social')) document.getElementById('pdf-report-razao-social').innerText = c.razao_social || "";
            if (document.getElementById('pdf-report-cnpj')) document.getElementById('pdf-report-cnpj').innerText = "CNPJ: " + (c.cnpj || "");
        }


        function saveCompanyDetails(e) {
            e.preventDefault();
            const rName = document.getElementById('comp-responsavel').value;
            const fName = document.getElementById('comp-fantasia').value;
            const ie = document.getElementById('comp-ie').value;
            const cnpj = document.getElementById('comp-cnpj').value;
            const address = document.getElementById('comp-endereco').value;
            const phone = document.getElementById('comp-telefone').value;
            const rSocial = document.getElementById('comp-razao').value;

            const compData = {
                razao_social: rSocial,
                nome_fantasia: fName,
                cnpj: cnpj,
                inscricao_estadual: ie,
                endereco: address,
                responsavel_legal: rName,
                telefone: phone,
                logo_base64: currentLogoData || ""
            };

            // Update states and layout
            applyCompanyDetails(compData);

            // Save to local cache
            SafeStorage.setItem('condosphere_company', JSON.stringify(compData));
            showToast("Dados da empresa salvos com sucesso!", "success");

            // Sync with Supabase (Upsert company settings)
            if (supabaseClient) {
                dbClient.from('company_settings').upsert({
                    id: 'main',
                    ...compData
                }).then(({ error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Company settings sync failed:", error.message);
                        showToast("Erro ao sincronizar dados da empresa", "error");
                    } else {
                        showToast("Dados da empresa sincronizados na nuvem!", "success");
                    }
                });
            }
        }


        // Brand logo uploader rendering
        function uploadLogoLocal(input) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = e.target.result;
                    currentLogoData = data;
                    document.getElementById('logo-img').src = data;
                    document.getElementById('logo-preview-box').src = data;
                    showToast("Logotipo de proporção 200x200px carregado com sucesso!");
                }
                reader.readAsDataURL(file);
            }
        }
