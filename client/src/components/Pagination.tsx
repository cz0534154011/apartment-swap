export type PaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}
function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }
    return (
        <nav className="pagination">
            <button className="pagination__btn" type="button" disabled={page === 1} onClick={() => onPageChange(page-1) }>הקודם</button>
            <span className="pagination__info">עמוד {page} מתוך {totalPages}</span>
            <button className="pagination__btn" type="button" disabled={page === totalPages} onClick={()=>onPageChange(page+1)} >הבא</button>
        </nav >
    )
}
export default Pagination