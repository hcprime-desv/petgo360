import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="secao">
      <div className="wrap" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="eyebrow">Erro 404</div>
        <h1 className="titulo">Página não encontrada</h1>
        <p className="sub" style={{ margin: "0 auto" }}>O endereço pode ter mudado ou o conteúdo não está mais publicado.</p>
        <div className="acoes" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primario">Ir para o início</Link>
          <Link href="/servicos" className="btn btn-contorno">Buscar serviços</Link>
        </div>
      </div>
    </section>
  );
}
