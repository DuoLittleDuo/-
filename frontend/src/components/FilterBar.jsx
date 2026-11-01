const PET_TYPES = [
  { value: '', label: '全部' },
  { value: '猫', label: '猫' },
  { value: '犬', label: '犬' },
  { value: '通用', label: '通用' },
]

const SORTS = [
  { value: 'hot', label: '推荐' },
  { value: 'new', label: '最新' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' },
]

const itemClass = (active) =>
  `shrink-0 whitespace-nowrap border-b pb-1 text-sm transition duration-300 ease-silk ${
    active ? 'border-clay text-clay' : 'border-transparent text-ink/55 hover:text-clay'
  }`

const chipClass = (active) =>
  `border-b pb-0.5 text-xs transition duration-300 ease-silk ${
    active ? 'border-clay text-clay' : 'border-transparent text-ink/55 hover:text-clay'
  }`

export default function FilterBar({
  categories = [],
  categoryId,
  petType = '',
  sort = 'hot',
  showBrowseFilters = false,
  onCategory,
  onPetType,
  onSort,
  trailing = null,
}) {
  return (
    <div className="border-y border-line">
      <div className="no-scrollbar flex items-center gap-7 overflow-x-auto py-4">
        <button type="button" onClick={() => onCategory(null)} className={itemClass(categoryId == null)}>
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategory(category.id)}
            className={itemClass(categoryId === category.id)}
          >
            {category.name}
            <span className="ml-1.5 font-mono text-[10px] text-ink/35">
              {category.product_count}
            </span>
          </button>
        ))}

        {trailing ? <div className="ml-auto shrink-0">{trailing}</div> : null}
      </div>

      {showBrowseFilters ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line py-3.5">
          <span className="eyebrow text-ink/40">宠物</span>
          {PET_TYPES.map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              onClick={() => onPetType(item.value)}
              className={chipClass(petType === item.value)}
            >
              {item.label}
            </button>
          ))}

          <span className="eyebrow ml-auto text-ink/40">排序</span>
          {SORTS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onSort(item.value)}
              className={chipClass(sort === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
